
import {CLOUD} from "../../cloudAPI";

export const syncDown = function (userId, options) {
  return new Promise((resolve, reject) => {
    let cloudSpheres = [];
    let cloudSpheresData = {};
    let cloudKeys = [];
    let cloudDevices = [];
    let cloudUser = {};

    let syncPromises = [];

    syncPromises.push(
      CLOUD.getUserData(options)
        .then((data) => {
          cloudUser = data;
        })
    );

    syncPromises.push(
      CLOUD.getKeys(options)
        .then((data) => {
          cloudKeys = data;
        })
    );

    syncPromises.push(
      CLOUD.forUser(userId).getDevices(options)
        .then((data) => {
          cloudDevices = data;
        })
    );

    syncPromises.push(
      CLOUD.getSpheres(options)
        .then((sphereData) => {
          let sphereDataPromises = [];
          sphereData.forEach((sphere) => {
            cloudSpheres.push(sphere);

            // download all data from the cloud to the phone
            sphereDataPromises.push(CLOUD.forSphere(sphere.id).getSphereData(userId, options)
              .then((result) => {
                cloudSpheresData[sphere.id] = result;
              })
            );
          });
          return Promise.all(sphereDataPromises);
        })
    );

    Promise.all(syncPromises)
      .then(() => {
        resolve({keys: cloudKeys, spheres: cloudSpheres, spheresData: cloudSpheresData, devices: cloudDevices, user: cloudUser})
      })
      .catch((err) => {
        reject(err);
      })
  });
};
