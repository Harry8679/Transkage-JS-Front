import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const SignUpForm = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { firstName, lastName, email, password, confirmPassword, acceptTerms } = formData;

    if (!acceptTerms) return setMessage("Veuillez accepter les conditions.");
    if (password !== confirmPassword) return setMessage("Les mots de passe ne correspondent pas.");

    try {
      const res = await axios.post("http://localhost:8500/api/v1/users/register", {
        firstName,
        lastName,
        email,
        password,
      });

      setMessage("✅ Inscription réussie, vérifiez votre email.");
    } catch (error) {
      const msg = error.response?.data?.message || "Erreur lors de l'inscription.";
      setMessage(`❌ ${msg}`);
    }
  };

  return (
    <form className="row y-gap-20" onSubmit={handleSubmit}>
      <div className="col-12">
        <h1 className="text-22 fw-500">Bienvenue</h1>
        <p className="mt-10">
          Vous avez déjà un compte ?{" "}
          <Link to="/login" className="text-blue-1">
            Se connecter
          </Link>
        </p>
        {message && <div className="mt-10 text-red-1 text-14">{message}</div>}
      </div>

      <div className="col-12">
        <div className="form-input">
          <input type="text" required name="lastName" value={formData.lastName} onChange={handleChange} />
          <label>Nom</label>
        </div>
      </div>

      <div className="col-12">
        <div className="form-input">
          <input type="text" required name="firstName" value={formData.firstName} onChange={handleChange} />
          <label>Prénom</label>
        </div>
      </div>

      <div className="col-12">
        <div className="form-input">
          <input type="email" required name="email" value={formData.email} onChange={handleChange} />
          <label>Email</label>
        </div>
      </div>

      <div className="col-12">
        <div className="form-input">
          <input type="password" required name="password" value={formData.password} onChange={handleChange} />
          <label>Mot de passe</label>
        </div>
      </div>

      <div className="col-12">
        <div className="form-input">
          <input type="password" required name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
          <label>Confirmation du mot de passe</label>
        </div>
      </div>

      <div className="col-12">
        <div className="d-flex">
          <div className="form-checkbox mt-5">
            <input type="checkbox" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} />
            <div className="form-checkbox__mark">
              <div className="form-checkbox__icon icon-check" />
            </div>
          </div>
          <div className="text-15 lh-15 text-light-1 ml-10">
            Accepter les conditions pour valider votre inscription
          </div>
        </div>
      </div>

      <div className="col-12">
        <button type="submit" className="button py-20 -dark-1 bg-blue-1 text-white w-100">
          Inscription <div className="icon-arrow-top-right ml-15" />
        </button>
      </div>
    </form>
  );
};

export default SignUpForm;
