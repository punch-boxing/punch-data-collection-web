let granted = false;

const acc = { x: 0, y: 0, z: 0 };
const gyro = { x: 0, y: 0, z: 0 };

async function requestPermissions() {
  try {
    if (
      typeof DeviceMotionEvent.requestPermission === "function" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      await DeviceMotionEvent.requestPermission().then((motionPerm) => {
        if (motionPerm !== "granted") {
          alert("Motion permission was denied.");
          granted = false;
          return false;
        }
      });
      await DeviceOrientationEvent.requestPermission().then(
        (orientationPerm) => {
          if (orientationPerm !== "granted") {
            alert("Orientation permission was denied.");
            granted = false;
            return false;
          }
        }
      );
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

  // window.addEventListener("deviceorientation", (event) => {
  //   gyro.x = event.alpha || 0;
  //   gyro.y = event.beta || 0;
  //   gyro.z = event.gamma || 0;
  // });

  window.addEventListener("devicemotion", (event) => {
    if (event.accelerationIncludingGravity) {
      acc.x = event.accelerationIncludingGravity.x / 9.8 || 0;
      acc.y = event.accelerationIncludingGravity.y / 9.8 || 0;
      acc.z = event.accelerationIncludingGravity.z / 9.8 || 0;
    }
  });

  let gyroscope = new Gyroscope({ frequency: 50 });
  gyroscope.addEventListener("reading", () => {
    gyro.x = gyroscope.x || 0;
    gyro.y = gyroscope.y || 0;
    gyro.z = gyroscope.z || 0;
  });

  setInterval(() => {
    document.getElementById("accX").textContent = `x: ${acc.x.toFixed(2)}`;
    document.getElementById("accY").textContent = `y: ${acc.y.toFixed(2)}`;
    document.getElementById("accZ").textContent = `z: ${acc.z.toFixed(2)}`;
    document.getElementById("gyroX").textContent = `x (alpha): ${gyro.x.toFixed(
      2
    )}`;
    document.getElementById("gyroY").textContent = `y (beta): ${gyro.y.toFixed(
      2
    )}`;
    document.getElementById("gyroZ").textContent = `z (gamma): ${gyro.z.toFixed(
      2
    )}`;
  }, 50);
}

function stopTracking() {
  const stopButton = document.getElementById("stopButton");
  stopButton.style.display = "none";
  const startButton = document.getElementById("startButton");
  startButton.style.display = "inline-block";

  window.removeEventListener("devicemotion", () => {});
  window.removeEventListener("deviceorientation", () => {});

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
