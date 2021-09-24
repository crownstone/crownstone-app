
export function mockFileUtil() {
  jest.mock("../../../app/ts/util/FileUtil", () => {
    const FileUtil = {

      index: function() {
      },

      getPath: function(filename? : string) {
        return 'testPath/filename'
      },


      safeMoveFile: function(from,to) {
      },

      safeDeleteFile: async function(uri) : Promise<void>  {
      },

      copyCameraRollPictureToTempLocation: function(fileData) {
      },

      fileExists: function(path) {
        return false
      }

    };


    return { FileUtil }
  })
}

