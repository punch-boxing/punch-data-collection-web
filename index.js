let granted = false;
let interval;

const acc = { x: 0, y: 0, z: 0 };
const gyro = { x: 0, y: 0, z: 0 };
const ori = { x: 0, y: 0, z: 0 };

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
    // console.error("Permission error:", err);
    // alert("Failed to get motion/orientation permissions.");
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
      acc.x = event.accelerationIncludingGravity.x / 9.8 || 0;
      acc.y = event.accelerationIncludingGravity.y / 9.8 || 0;
      acc.z = event.accelerationIncludingGravity.z / 9.8 || 0;
    }
    if (event.rotationRate) {
      gyro.x = event.rotationRate.alpha / Math.PI || 0;
      gyro.y = event.rotationRate.beta / Math.PI || 0;
      gyro.z = event.rotationRate.gamma / Math.PI || 0;
    }
  });

  interval = setInterval(() => {
    console.log("acc:", acc, "gyro:", gyro);
    ({ acc, ori } = autoCalibrate(
      new Vector3D(acc.x, acc.y, acc.z),
      new Vector3D(gyro.x, gyro.y, gyro.z),
      defaultVector,
      50
    ));

    document.getElementById("accX").textContent = `x: ${acc.x.toFixed(2)}`;
    document.getElementById("accY").textContent = `y: ${acc.y.toFixed(2)}`;
    document.getElementById("accZ").textContent = `z: ${acc.z.toFixed(2)}`;
    document.getElementById("gyroX").textContent = `x (alpha): ${Math.sin(
      ori.x
    ).toFixed(2)}`;
    document.getElementById("gyroY").textContent = `y (beta): ${Math.sin(
      ori.y
    ).toFixed(2)}`;
    document.getElementById("gyroZ").textContent = `z (gamma): ${Math.sin(
      ori.z
    ).toFixed(2)}`;
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
  document.getElementById("gyroX").textContent = "x (alpha): 0.00";
  document.getElementById("gyroY").textContent = "y (beta): 0.00";
  document.getElementById("gyroZ").textContent = "z (gamma): 0.00";
}

// document.getElementById("startButton").addEventListener("click", async () => {
//   console.log("Start button clicked");
//   if (granted) {
//     startTracking();
//     document.getElementById("startButton").style.display = "none";
//   } else {
//     await requestPermissions();
//     if (granted) {
//       startTracking();
//       document.getElementById("startButton").style.display = "none";
//     }
//   }
// });

// document.getElementById("stopButton").addEventListener("click", () => {
//   stopTracking();
//   document.getElementById("stopButton").style.display = "none";
// });

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
    return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);
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
    0,
    orientation.z + (gyro.z * dt) / 1000
  );
};

const autoCalibrate = (acceleration, gyro, orientation, dt) => {
  const threshold = 1.1;
  /**
   * @param {Vector3D} acceleration
   * @param {Vector3D} gyro
   * @param {Vector3D} orientation
   * @param {number} dt
   * @returns {CalibrationResult}
   */
  // cosine similarity should be more than 0.5(which means 60 degrees) since the error value magnifies as the angle converges to 90 degrees(x axis)
  if (
    acceleration.magnitude() < threshold &&
    acceleration.cosineSimilarity(defaultVector) > 0.5
  ) {
    let _acceleration = acceleration.normalize();
    orientation = new Vector3D(
      -Math.PI - Math.atan2(_acceleration.z, _acceleration.y),
      0,
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
