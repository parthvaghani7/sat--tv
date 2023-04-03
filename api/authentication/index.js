const passport = require("passport");
const JWTstrategy = require("passport-jwt").Strategy;
const ExtractJWT = require("passport-jwt").ExtractJwt;

exports.check = (req, res, next) => {
  passport.use(
    new JWTstrategy(
      {
        secretOrKey: "ThisIsASecretKey",
        jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      },
      async (token, done) => {
        try {
          return done(null, token);
        } catch (error) {
          done(error, token);
        }
      }
    )
  );
  const header = req.headers.authorization;
  if (header) {
    passport.authenticate("jwt", async (err, token) => {
      if (err) {
        return res.sendStatus(401);
      }
      if (token) {
        res.locals.user = token.user;
        res.locals.accessToken = token.accessToken;
        return next();
      }
      return res.sendStatus(401);
    })(req, res, next);
  } else {
    res.sendStatus(401);
  }
};
