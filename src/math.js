import { Vector3D, defaultVector } from "./vector";

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

export { autoCalibrate, initializeOrientaion, calculateGravity, integrateGyro };
