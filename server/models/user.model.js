const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const allowedRoles = ['sender', 'transporter'];

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String,required: true },
  photo: { type: String, default: 'https://github.com/zinotrust/auth-app-styles/blob/master/assets/avatarr.png?raw=true' },
  roles: { type: [String], required: true, validate: { validator: function (roles) {
        return roles.every((role) => allowedRoles.includes(role));
      },
      message: (props) => `${props.value} is not a valid role!`,
    },
  },
});

// Middleware pour hacher le mot de passe
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
