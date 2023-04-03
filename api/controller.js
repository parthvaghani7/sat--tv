const jwt = require("jsonwebtoken");
const jsonfile = require("jsonfile");
const AWS = require("aws-sdk");
const config = require("../config.json");
let db = require("../db/db.json");
const subscriptionPlans = require("../db/subscription-plans.json");

AWS.config.update({
  accessKeyId: config.accessKey,
  secretAccessKey: config.secretAccessKey,
  region: "us-west-2",
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

const writeToJSON = (obj) =>
  jsonfile.writeFile("./db/db.json", obj, "utf8", (err, data) => {
    if (err) throw err;
  });

const distinct = (val, i, d) => {
  return d.indexOf(val) === i;
};

const sendEmail = async (email, message, sub) => {
  try {
    const params = {
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<html>
                            <head>
                            </head>
                            <body style="align:center;margin:auto;text-align:center;width:100%;">
                                <p>${message}</p>
                            </body>
                            </html>`,
          },
          Text: {
            Charset: "UTF-8",
            Data: sub,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: sub,
        },
      },
      Source: "vaparth6@gmail.com",
    };

    const send = await ses.sendEmail(params).promise();
    return send;
  } catch (err) {
    return false;
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const { email } = res.locals.user;
    const [data] = db && db.filter((x) => x.email === email);
    if (!data) {
      return next({ message: "User Not Found" });
    }
    res.json({
      email: data.email,
      phone: data.phone,
      new: data.new,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentBalance = async (req, res, next) => {
  try {
    const { email } = res.locals.user;

    const [data] = db && db.filter((x) => x.email === email);
    res.json({
      balance: (data && data.balance) || 0,
      email,
    });
  } catch (err) {
    next(err);
  }
};

exports.getAvailableSubscriptions = async (req, res, next) => {
  try {
    res.json({
      subscriptions: subscriptionPlans,
    });
  } catch (err) {
    next(err);
  }
};

exports.getCurrentSubscription = async (req, res, next) => {
  try {
    const { email } = res.locals.user;

    let [{ activeServices, activeSubscription }] =
      db && db.filter((x) => x.email === email);

    const extraChannels =
      (!!activeSubscription.extraChannels && [
        activeSubscription.extraChannels.join(" + "),
      ]) ||
      [];
    const subscription =
      (!!activeSubscription.name && [activeSubscription.name]) || [];

    activeSubscription = [...subscription, ...extraChannels].join(" + ");

    res.json({
      activeSubscription,
      activeServices: data.activeServices && data.activeServices.join(", "),
    });
  } catch (err) {
    next(err);
  }
};

exports.enter = async (req, res, next) => {
  try {
    const { email, phone } = req.body;

    if (!email) {
      return next({ message: "Email required." });
    }

    const [data] = db && db.filter((x) => x.email === email);
    const token = jwt.sign({ user: { email } }, "ThisIsASecretKey", {
      expiresIn: "30d",
    });

    if (!data) {
      const obj = {
        email,
        phone,
        balance: 100,
      };
      db.push(obj);
      await writeToJSON(db);
    }
    res.json({
      email,
      phone,
      token,
    });
  } catch (err) {
    next(err);
  }
};

exports.recharge = async (req, res, next) => {
  try {
    let currentBalance = 0;
    const { email } = res.locals.user;
    const { amount } = req.body;

    const data =
      db &&
      db.map((x) => {
        if (x.email === email) {
          currentBalance = x.balance += parseInt(amount);
          x.balance = currentBalance;
        }
        return x;
      });
    await writeToJSON(data);
    res.json({
      message: "Recharge Successful.",
      amount,
      currentBalance,
    });
  } catch (err) {
    next(err);
  }
};

exports.subscribeChannelPacks = async (req, res, next) => {
  try {
    let currentBalance = 0;
    let accountBalance = 0;
    let subscriptionAmount = 0;
    let monthlyPrice = 0;
    let discount = 0;
    let finalPrice = 0;
    const { email } = res.locals.user;
    const { packName, months } = req.body;

    const [pack] = subscriptionPlans["Packs"].filter(
      (x) => x.PackName === packName
    );
    const data = db.map((x) => {
      if (x.email === email) {
        monthlyPrice = pack.Price;
        currentBalance = x.balance;
        subscriptionAmount = monthlyPrice * months;
        if (months >= 3) {
          discount = (subscriptionAmount * 10) / 100;
        }
        finalPrice = subscriptionAmount - discount;
        x.activeSubscription = {
          ...x.activeSubscription,
          name: packName,
          channels: pack.Channels,
        };
        accountBalance = currentBalance - finalPrice;
        x.balance = accountBalance;
      }
      return x;
    });
    if (accountBalance < 0) {
      return next({ message: "Insufficient Balance." });
    }
    await writeToJSON(data);
    res.json({
      message: `You have successfully subscribed ${packName} pack.`,
      monthlyPrice,
      noOfMonths: months,
      subscriptionAmount,
      discount,
      finalPrice,
      accountBalance,
    });
  } catch (err) {
    next(err);
  }
};

exports.addChannelsToExistingSubscription = async (req, res, next) => {
  try {
    let currentBalance = 0;
    let accountBalance = 0;
    let finalPrice = 0;
    let activeChannels = [];

    const { email } = res.locals.user;
    const { channels } = req.body;

    subscriptionPlans["Channels"].filter((x) => {
      if (channels.includes(x.ChannelName)) {
        finalPrice += x.Price;
      }
    });
    const data = db.map((x) => {
      if (x.email === email) {
        currentBalance = x.balance;
        activeChannels =
          (x.activeSubscription && x.activeSubscription.extraChannels) || [];
        const extraChannels =
          (x.activeSubscription &&
            x.activeSubscription.extraChannels &&
            x.activeSubscription.extraChannels.concat(channels)) ||
          channels;
        x.activeSubscription = {
          ...x.activeSubscription,
          extraChannels,
        };
        accountBalance = currentBalance - finalPrice;
        x.balance = accountBalance;
      }
      return x;
    });
    if (accountBalance < 0) {
      return next({ message: "Insufficient Balance." });
    }
    const isExists = activeChannels.filter((x) => channels.includes(x));

    if (isExists.length) {
      return next({ message: "Channel already added." });
    }
    await writeToJSON(data);

    //await sendEmail(email, `You have subscribed new ${channels.join(',')} channels.`, 'SatTV Subscription');

    res.json({
      message: "Channels added successfully.",
      accountBalance,
    });
  } catch (err) {
    next(err);
  }
};

exports.subscribeToSpecialService = async (req, res, next) => {
  try {
    let currentBalance = 0;
    let accountBalance = 0;
    let finalPrice = 0;
    let activeServices = [];

    const { email } = res.locals.user;
    const { serviceName } = req.body;

    const [currentService] = subscriptionPlans["Services"].filter(
      (x) => x.ServiceName === serviceName
    );
    const data = db.map((x) => {
      if (x.email === email) {
        currentBalance = x.balance;
        activeServices = x.activeServices;
        x.activeServices = x.activeServices
          ? [...x.activeServices, serviceName]
          : [serviceName];
        finalPrice = currentService.Price;
        accountBalance = currentBalance - finalPrice;
        x.balance = accountBalance;
      }
      return x;
    });
    if (accountBalance < 0) {
      return next({ message: "Insufficient Balance." });
    }
    if (activeServices && activeServices.includes(serviceName)) {
      return next({ message: "Service already added." });
    }
    await writeToJSON(data);
    res.json({
      message: "Service subscribed successfully.",
      accountBalance,
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    let token;
    const { email } = res.locals.user;
    const { email: emaillAdd, phone } = req.body;

    const [user] = db && db.filter((x) => x.email === email);
    if (email && emaillAdd !== email) {
      const [isExists] = db && db.filter((x) => x.email === emaillAdd);
      if (isExists) {
        return next({ message: "Email already exists" });
      }
    }

    if (user) {
      const data = db.map((x) => {
        if (x.email === email) {
          return {
            ...x,
            email: emaillAdd ? emaillAdd : x.email,
            phone: phone ? phone : x.phone,
          };
        }
        return x;
      });
      if (emaillAdd) {
        token = jwt.sign({ user: { email: emaillAdd } }, "ThisIsASecretKey", {
          expiresIn: "30d",
        });
      }

      await writeToJSON(data);
      res.json({
        email: emaillAdd,
        phone,
        token,
      });
    } else {
      next({ message: "User Not Found" });
    }
  } catch (err) {
    next(err);
  }
};
