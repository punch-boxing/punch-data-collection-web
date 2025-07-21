let granted = false;
let interval;

let acc;
let gyro;
let ori;

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

  const startButton = document.getElementById("startButton");
  startButton.style.display = "none";
  const stopButton = document.getElementById("stopButton");
  stopButton.style.display = "inline-block";

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
    } else {
      result = autoCalibrate(acc, gyro, ori, 50);
      acc = result.acceleration;
      ori = result.orientation;
    }

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

    // const gyroXElem = document.getElementById("gyroX");
    // const gyroYElem = document.getElementById("gyroY");
    // const gyroZElem = document.getElementById("gyroZ");

    // gyroXElem.textContent = `x (alpha): ${gyro.x.toFixed(2)}`;
    // gyroXElem.style.color =
    //   Math.abs(gyro.x) > 10 && gyro.x > 0 ? "green" : "red";

    // gyroYElem.textContent = `y (beta): ${gyro.y.toFixed(2)}`;
    // gyroYElem.style.color =
    //   Math.abs(gyro.y) > 10 && gyro.y > 0 ? "green" : "red";

    // gyroZElem.textContent = `z (gamma): ${gyro.z.toFixed(2)}`;
    // gyroZElem.style.color =
    //   Math.abs(gyro.z) > 10 && gyro.z > 0 ? "green" : "red";
  }, 50);
}

function stopTracking() {
  const stopButton = document.getElementById("stopButton");
  stopButton.style.display = "none";
  const startButton = document.getElementById("startButton");
  startButton.style.display = "inline-block";

  window.removeEventListener("devicemotion", () => {});
  clearInterval(interval);

  acc.x = acc.y = acc.z = 0;
  gyro.x = gyro.y = gyro.z = 0;

  document.getElementById("accX").textContent = "x: 0.00";
  document.getElementById("accY").textContent = "y: 0.00";
  document.getElementById("accZ").textContent = "z: 0.00";
  document.getElementById("oriX").textContent = "x: 0.00";
  document.getElementById("oriY").textContent = "y: 0.00";
  document.getElementById("oriZ").textContent = "z: 0.00";
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
    "Cosine Similarity"
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
