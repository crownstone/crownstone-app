export class WebError extends Error {
  status = null;
  constructor(status, message?) {
    super(message);
    this.status = status;
  }
}

export class CodedError extends Error {
  code = null;
  constructor(code, message?) {
    super(message);
    this.code = code;
  }
}

export class CodedTypedError extends Error {
  status = null;
  type = null;
  constructor(status, type, message?) {
    super(message);
    this.status = status;
    this.type = type;
  }

}