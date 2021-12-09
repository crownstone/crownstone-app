var expect = require('chai').expect;
describe('Simple App testing', () => {
  beforeEach(() => {
    $("~registerButton").waitForDisplayed(10000, false)
  });
  it('Login test: valid case', async () => {
    const item = $("~registerButton")
    let text = await item.getText()
    expect(text).to.equal('Register');
    driver.saveScreenshot("./tests_screenshots/driverfull.png")
  });
  // it('Login test: invalid case', async => {
  //   $('~username').setValue("nevercode");
  //   $('~password').setValue("codemagic");
  //   $("~login").click();
  //   $("~loginstatus").waitForDisplayed(11000);
  //   const status = $("~loginstatus").getText();
  //   expect(status).to.equal('fail');
  // });
  // it('Login test: valid case', async => {
  //   $('~username').setValue("codemagic");
  //   $('~password').setValue("nevercode");
  //   $("~login").click();
  //   $("~loginstatus").waitForDisplayed(11000);
  //   const status = $("~loginstatus").getText();
  //   expect(status).to.equal('success');
  // });
  // it('Login test: invalid case', async => {
  //   $('~username').setValue("nevercode");
  //   $('~password').setValue("codemagic");
  //   $("~login").click();
  //   $("~loginstatus").waitForDisplayed(11000);
  //   const status = $("~loginstatus").getText();
  //   expect(status).to.equal('fail');
  // });
});