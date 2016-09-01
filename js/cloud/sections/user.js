

export const user = {
  /**
   *
   * @param options
   * @returns {Promise}
   */
  registerUser: function(options) {
    return this._setupRequest('POST', 'users', {data:{
      email: options.email,
      password: options.password,
      firstName: options.firstName,
      lastName: options.lastName
    }}, 'body');
  },

  /**
   *
   * @param options
   * {
   *   email: string,
   *   password: string,
   *   onUnverified: callback,
   *   onInvalidCredentials: callback,
   *   background: boolean
   * }
   *
   * resolves with the parsed data, rejects with {status: httpStatus, data: data}
   */
  login: function(options) {
    return new Promise((resolve, reject) => {
      this._post({ endPoint:'users/login', data:{ email: options.email, password: options.password } , type:'body'})
        .then((reply) => {
          if (reply.status === 200) {
            resolve(reply.data)
          }
          else {
            if (reply.data && reply.data.error && reply.data.error.code) {
              switch (reply.data.error.code) {
                case 'LOGIN_FAILED_EMAIL_NOT_VERIFIED':
                  if (options.onUnverified)
                    options.onUnverified();
                  break;
                case 'LOGIN_FAILED':
                  if (options.onInvalidCredentials)
                    options.onInvalidCredentials();
                  break;
                default:
                  this.__debugReject(reply, reject, options);
              }
            }
            else {
              this.__debugReject(reply, reject, options);
            }
          }
        }).catch((error) => {this._handleNetworkError(error, options);});
    })
  },

  /**
   *
   * @param file {String} --> full path string.
   */
  uploadProfileImage: function(file) {
    return this._uploadImage({endPoint:'/users/{id}/profilePic', path:file, type:'body'})
  },

  /**
   *
   * @param toPath
   */
  downloadProfileImage: function (toPath) {
    return this._download({endPoint:'/users/{id}/profilePic'}, toPath);
  },


  removeProfileImage: function() {

  },

  /**
   *
   * @returns {*}
   */
  getUserData: function (options = {}) {
    return this._setupRequest('GET', '/users/me', options);
  },

  /**
   *
   * @param options
   * @returns {Promise}
   */
  updateUserData: function(options = {}) {
    return this._setupRequest('PUT', '/users/{id}', options, 'body');
  },

  /**
   *
   * @param options
   */
  requestVerificationEmail: function(options = {}) {
    return this._setupRequest(
      'GET',
      'users/resendVerification',
      { data: { email: options.email }, background: options.background },
      'query'
    );
  },

  /**
   *
   * @param options
   */
  requestPasswordResetEmail: function(options = {}) {
    return this._setupRequest(
      'POST',
      'users/reset',
      { data: { email: options.email }, background: options.background },
      'body'
    );
  },

  getKeys: function(options = {}) {
    return this._setupRequest(
      'GET',
      'users/{id}/keys'
    );
  }

};