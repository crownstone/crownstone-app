
export class CodedError extends Error {

  code = null;
  constructor(code, message?) {
    super(message);
    this.code = code;
  }

}
export class CodedTypedError extends Error {

  code = null;
  type = null;
  constructor(code, type, message?) {
    super(message);
    this.code = code;
    this.type = code;
  }

}