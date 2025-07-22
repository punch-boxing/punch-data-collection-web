const columns =
  "Index,Time,Raw Acceleration X,Raw Acceleration Y,Raw Acceleration Z,Acceleration X,Acceleration Y,Acceleration Z,Angular Velocity X,Angular Velocity Y,Angular Velocity Z,Orientation X,Orientation Y,Orientation Z,Punch Type\n";
const punchTypes = ["Straight", "Hook", "Uppercut", "Body"];

let granted = false;
let interval;

let acc;
let gyro;
let ori;

let punch;
let punchIndex = 0;
let volume;

let index = 0;
let initialTime;
let data;

async function requestPermissions() {
  try {
    if (typeof DeviceMotionEvent.requestPermission === "function") {
      await DeviceMotionEvent.requestPermission().then((motionPerm) => {
        if (motionPerm !== "granted") {
          alert("Motion permission was denied.");
          granted = false;
          return false;
        }
      });
    }
    granted = true;
    return true;
  } catch (err) {
    alert(err.message);
    granted = false;
    return false;
  }
}

async function startTracking() {
  if (!granted) {
    await requestPermissions();
    if (!granted) {
      alert("Permissions not granted. Cannot start tracking.");
      return;
    }
  }

  // initialize variables
  data = columns;
  index = 0;
  acc = undefined;
  gyro = undefined;
  ori = undefined;
  punch = "None";
  initialTime = Date.now();

  const startButton = document.getElementById("startButton");
  startButton.style.display = "none";
  const stopButton = document.getElementById("stopButton");
  stopButton.style.display = "inline-block";
  document.getElementById(
    "punchType"
  ).textContent = `Punch: ${punchTypes[punchIndex]}`;

  window.addEventListener("devicemotion", (event) => {
    if (event.accelerationIncludingGravity) {
      acc = new Vector3D(
        event.accelerationIncludingGravity.x / 9.8,
        event.accelerationIncludingGravity.y / 9.8,
        event.accelerationIncludingGravity.z / 9.8
      );
    }
    if (event.rotationRate) {
      gyro = new Vector3D(
        (event.rotationRate.alpha / 180) * Math.PI,
        (event.rotationRate.beta / 180) * Math.PI,
        (event.rotationRate.gamma / 180) * Math.PI
      );
    }
  });

  interval = setInterval(() => {
    if (ori === undefined) {
      ori = initializeOrientaion(acc);
    }
    let rawAcc = acc;
    result = autoCalibrate(acc, gyro, ori, 50);
    acc = result.acceleration;
    ori = result.orientation;

    document.getElementById("accX").textContent = `x: ${acc.x.toFixed(2)}`;
    document.getElementById("accY").textContent = `y: ${acc.y.toFixed(2)}`;
    document.getElementById("accZ").textContent = `z: ${acc.z.toFixed(2)}`;
    document.getElementById("oriX").textContent = `x: ${Math.sin(ori.x).toFixed(
      2
    )}`;
    document.getElementById("oriY").textContent = `y: ${Math.sin(ori.y).toFixed(
      2
    )}`;
    document.getElementById("oriZ").textContent = `z: ${Math.sin(ori.z).toFixed(
      2
    )}`;
    document.getElementById("gyroX").textContent = `x: ${gyro.x.toFixed(2)}`;
    document.getElementById("gyroY").textContent = `y: ${gyro.y.toFixed(2)}`;
    document.getElementById("gyroZ").textContent = `z: ${gyro.z.toFixed(2)}`;

    data += `${index},${Date.now() - initialTime},${rawAcc.x.toFixed(
      2
    )},${rawAcc.y.toFixed(2)},${rawAcc.z.toFixed(2)},${acc.x.toFixed(
      2
    )},${acc.y.toFixed(2)},${acc.z.toFixed(2)},${gyro.x.toFixed(
      2
    )},${gyro.y.toFixed(2)},${gyro.z.toFixed(2)},${Math.sin(ori.x).toFixed(
      2
    )},${Math.sin(ori.y).toFixed(2)},${Math.sin(ori.z).toFixed(2)},${punch}\n`;

    if (punch !== "None") {
      punch = "None";
      // document.getElementById("Punch").textContent = `Punch: ${punch}`;
    }

    index++;
  }, 50);
}

function setPunch() {
  if (acc !== undefined && gyro !== undefined && ori !== undefined) {
    punch = punchTypes[punchIndex];
  }
}

function changePunch() {
  punchIndex = (punchIndex + 1) % punchTypes.length;
  document.getElementById("punch").textContent = punchTypes[punchIndex];
  document.getElementById(
    "punchType"
  ).textContent = `Punch: ${punchTypes[punchIndex]}`;
}

function stopTracking() {
  const stopButton = document.getElementById("stopButton");
  stopButton.style.display = "none";
  const startButton = document.getElementById("startButton");
  startButton.style.display = "inline-block";

  window.removeEventListener("devicemotion", () => {});
  clearInterval(interval);
}

function setDataContainerVisibility() {
  const punchButton = document.getElementById("punch");
  const dataContainer = document.getElementById("dataContainer");
  if (dataContainer.style.display === "block") {
    punchButton.style.display = "inline-block";
    dataContainer.style.display = "none";
    document.getElementById("watchDataButton").textContent = "정보 보기";
  } else {
    punchButton.style.display = "none";
    dataContainer.style.display = "block";
    document.getElementById("watchDataButton").textContent = "정보 닫기";
  }
}

function sendData() {
  const url = "https://punch-data-collection.hayward2007.workers.dev";
  const headers = {
    "Content-Type": "text/csv",
  };
  const options = {
    method: "POST",
    headers: headers,
    body: data,
  };

  if (data === columns) {
    alert("No data to send.");
    return;
  }

  fetch(url, options)
    .then((response) => {
      if (response.ok) {
        alert("Data sent successfully!");
      } else {
        alert("Failed to send data. Status: " + response.status);
      }
    })
    .catch((error) => {
      alert("Error sending data: " + error.message);
    });

  // const file = document.getElementById('fileInput').files[0];
  //   const formData = new FormData();
  //   formData.append('file', file);

  //   const res = await fetch('https://csv-uploader.<yourname>.workers.dev', {
  //     method: 'POST',
  //     body: formData,
  //   });

  //   const result = await res.text();
  //   document.getElementById('output').textContent = result;
}

/**
 * @typedef {number} Number
 */

/**
 * 3D Vector class
 */
class Vector3D {
  /** @type {number} */
  x;
  /** @type {number} */
  y;
  /** @type {number} */
  z;

  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * @returns {number}
   */
  magnitude() {
    const mag = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
    if (mag === 0) {
      return 1;
    }
    return mag;
  }

  /**
   * @returns {Vector3D}
   */
  normalize() {
    const mag = this.magnitude();
    return new Vector3D(this.x / mag, this.y / mag, this.z / mag);
  }

  /**
   * @param {Vector3D} other
   * @returns {Vector3D}
   */
  subtract(other) {
    return new Vector3D(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  /**
   * @param {Vector3D} other
   * @returns {number}
   */
  dot(other) {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  /**
   * @param {Vector3D} other
   * @returns {number}
   */
  cosineSimilarity(other) {
    const dotProduct = this.dot(other);
    const magnitudeA = this.magnitude();
    const magnitudeB = other.magnitude();
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

/** @type {Vector3D} */
const defaultVector = new Vector3D(0, -1, 0);

/**
 * @typedef {Object} CalibrationResult
 * @property {Vector3D} acceleration
 * @property {Vector3D} orientation
 */

const initializeOrientaion = (acceleration) => {
  /** @type {Vector3D} */
  acceleration = acceleration.normalize();
  return new Vector3D(
    -Math.PI - Math.atan2(acceleration.z, acceleration.y),
    0,
    Math.asin(acceleration.x)
  );
};

const calculateGravity = (orientaion) => {
  return new Vector3D(
    -Math.sin(orientaion.z),
    -Math.cos(orientaion.x) * Math.cos(orientaion.z),
    Math.sin(orientaion.x) * Math.cos(orientaion.z)
  );
};

const integrateGyro = (orientation, gyro, dt) => {
  return new Vector3D(
    orientation.x + (gyro.x * dt) / 1000,
    orientation.y + (gyro.y * dt) / 1000,
    orientation.z + (gyro.z * dt) / 1000
  );
};

const autoCalibrate = (acceleration, gyro, orientation, dt) => {
  // console.log("acc:", acceleration, "gyro:", gyro);
  const threshold = 1.1;
  /**
   * @param {Vector3D} acceleration
   * @param {Vector3D} gyro
   * @param {Vector3D} orientation
   * @param {number} dt
   * @returns {CalibrationResult}
   */
  // cosine similarity should be more than 0.5(which means 60 degrees) since the error value magnifies as the angle converges to 90 degrees(x axis)
  document.getElementById(
    "cosineSimilarity"
  ).textContent = `Cosine Similarity: ${acceleration
    .cosineSimilarity(defaultVector)
    .toFixed(2)}`;

  if (
    acceleration.magnitude() < threshold &&
    acceleration.cosineSimilarity(defaultVector) > 0.5
  ) {
    let _acceleration = acceleration.normalize();
    orientation = new Vector3D(
      -Math.PI - Math.atan2(_acceleration.z, _acceleration.y),
      orientation.y + (gyro.y * dt) / 1000,
      -Math.asin(_acceleration.x)
    );
  } else {
    orientation = integrateGyro(orientation, gyro, dt);
  }

  return {
    acceleration: acceleration.subtract(calculateGravity(orientation)),
    orientation: orientation,
  };
};

window.onload = async () => {
  document.getElementById("punch").textContent = punchTypes[punchIndex];
};
