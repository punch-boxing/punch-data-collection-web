/**
 * @typedef {number} Number
 */

/**
 * 3D Vector class
 */
export class Vector3D {
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
export const defaultVector = new Vector3D(0, -1, 0);
