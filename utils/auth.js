const { Select, Invisible, prompt } = require("enquirer");
require("dotenv").config();

const tokenAuth = async () => {
  if (process.env.BITBUCKET_ACCESS_TOKEN)
    return process.env.BITBUCKET_ACCESS_TOKEN;

  const prompt = new Invisible({
    name: "secret",
    message: "Enter access token:",
  });

  const token = await prompt.run();
  return { token };
};

const appPasswordAuth = async () => {
  if (process.env.BITBUCKET_USERNAME && process.env.BITBUCKET_APP_PASSWORD) {
    return {
      username: process.env.BITBUCKET_USERNAME,
      password: process.env.BITBUCKET_APP_PASSWORD,
    };
  }
  const auth = await prompt([
    {
      type: "input",
      name: "username",
      message: "Username",
    },
    {
      type: "password",
      name: "password",
      message: "Password",
    },
  ]);
  return auth;
};

const getAuth = async () => {
  const prompt = new Select({
    name: "authMethod",
    message: "Choose Auth Method",
    choices: ["Token", "App password"],
  });

  const authMethod = await prompt.run();
  switch (authMethod) {
    case "Token":
      return tokenAuth();
    case "App password":
      return appPasswordAuth();
    default:
      break;
  }
};

module.exports = getAuth;
