import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import logoIconOrange from "../assets/images/logoiconorange.png";
import { API_URL, clearAuthData, validateAuthToken } from "../utils/auth";
import LoadingScreen from "./LoadingScreen";

const SignIn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [forgotPasswordClicked, setForgotPasswordClicked] = useState(false);

  // Example toast functions for future use
  const showSuccessToast = (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: "12px",
        background: "#4CAF50",
        color: "#ffffff",
      },
    });
  };

  const showErrorToast = (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: "12px",
        background: "#F44336",
        color: "#ffffff",
      },
    });
  };

  const showInfoToast = (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: "12px",
        background: "#2196F3",
        color: "#ffffff",
      },
    });
  };

  const showWarningToast = (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
      style: {
        borderRadius: "12px",
        background: "#FF9800",
        color: "#ffffff",
      },
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    console.log("Attempting to sign in with:", {
      email: formData.email,
      password: "******",
    });

    try {
      // Call your backend API for authentication
      const response = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      console.log("Response status:", response.status);

      // Get the response text first to debug
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // If response is empty or not valid JSON, handle accordingly
      if (!responseText) {
        throw new Error("Server returned an empty response");
      }

      // Parse the response text into JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing JSON:", parseError);
        throw new Error("Invalid response format from server");
      }

      if (!response.ok) {
        // Extract specific error message from response if available
        let errorMessage = "Authentication failed";
        if (data && data.error) {
          errorMessage = data.error;
        } else if (data && data.message) {
          errorMessage = data.message;
        }
        throw new Error(errorMessage);
      }

      console.log("Authentication successful:", data);

      // Clear any existing auth data to prevent conflicts
      clearAuthData();

      // Store the token and expiration info in localStorage
      if (data.token) {
        localStorage.setItem("authToken", data.token);

        // Store token expiration information if available
        if (data.expiresAt) {
          localStorage.setItem(
            "tokenExpires",
            new Date(data.expiresAt).getTime().toString()
          );
          console.log(
            "Auth token stored with expiration:",
            new Date(data.expiresAt)
          );
        }

        console.log("Auth token stored in localStorage");
      } else {
        console.warn("No token received from server");
      }

      // If user data is already in the response, use it
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("User data stored from response:", data.user);
        showSuccessToast("Successfully signed in!");
        handleChatRedirect();
        return;
      }

      // Otherwise, get user profile data separately
      try {
        const userResponse = await fetch(
          `${API_URL}/users/email/${formData.email}`
        );
        console.log("User data response status:", userResponse.status);

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await userResponse.json();
        console.log("User data received:", userData);

        // Store user data
        localStorage.setItem("user", JSON.stringify(userData));

        showSuccessToast("Successfully signed in!");
        handleChatRedirect();
      } catch (userError) {
        console.error("Error fetching user data:", userError);
        // Continue even if user data fetch fails, since authentication was successful
        showSuccessToast("Signed in, but user data could not be loaded");
        handleChatRedirect();
      }
    } catch (err) {
      console.error("Authentication error:", err);

      // Handle different error scenarios with appropriate toast messages
      const errorMessage = err.message || "";
      const lowerCaseError = errorMessage.toLowerCase();

      // Specific error handling based on the error message
      if (
        lowerCaseError.includes("network") ||
        lowerCaseError.includes("connection")
      ) {
        // Network or connection error - critical (red)
        showErrorToast(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else if (lowerCaseError.includes("empty response")) {
        // Server error - critical (red)
        showErrorToast("The server is not responding. Please try again later.");
      } else if (lowerCaseError.includes("invalid response format")) {
        // Data format error - critical (red)
        showErrorToast(
          "Received an invalid response from the server. Please try again later."
        );
      } else if (
        lowerCaseError.includes("email not found") ||
        lowerCaseError.includes("user not found")
      ) {
        // Email doesn't exist - informational (yellow)
        showWarningToast(
          "This email is not registered. Please check your email or sign up for a new account."
        );
      } else if (
        lowerCaseError.includes("incorrect password") ||
        lowerCaseError.includes("wrong password")
      ) {
        // Wrong password - informational (yellow)
        showWarningToast(
          "Incorrect password. Please try again or use the forgot password option."
        );
      } else if (
        lowerCaseError.includes("account locked") ||
        lowerCaseError.includes("too many attempts")
      ) {
        // Account locked - critical (red)
        showErrorToast(
          "Your account has been temporarily locked due to too many failed attempts. Please try again later or reset your password."
        );
      } else if (
        lowerCaseError.includes("invalid") &&
        lowerCaseError.includes("email")
      ) {
        // Invalid email format - informational (yellow)
        showWarningToast("Please enter a valid email address.");
      } else if (
        lowerCaseError.includes("password") &&
        (lowerCaseError.includes("short") || lowerCaseError.includes("weak"))
      ) {
        // Password requirements - informational (yellow)
        showWarningToast("Your password does not meet the required criteria.");
      } else if (
        lowerCaseError.includes("account") &&
        lowerCaseError.includes("disabled")
      ) {
        // Account disabled - critical (red)
        showErrorToast(
          "Your account has been disabled. Please contact support for assistance."
        );
      } else {
        // Generic authentication error - critical (red)
        showErrorToast(
          "Authentication failed. Please check your email and password."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatRedirect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/chat");
    }, 1000);
  };

  const handleForgotPassword = () => {
    setForgotPasswordClicked(true);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/forgot-password");
    }, 1000);
  };

  useEffect(() => {
    const initGoogleSignIn = () => {
      if (window.google && !window.googleSignInInitialized) {
        console.log("Initializing Google Sign-In in signin page...");
        window.google.accounts.id.initialize({
          client_id:
            "433624047904-ea5ipm4k3ogi6fumrpjdu9c59hq1119l.apps.googleusercontent.com",
          callback: handleGoogleSignIn,
          prompt_parent_id: "googleSignInButton",
          ux_mode: "popup",
          allowed_origins: [
            window.location.origin,
            "http://localhost:3000",
            "http://127.0.0.1:3000",
          ],
        });
        window.googleSignInInitialized = true;
        console.log(
          "Google Sign-In initialized with origin:",
          window.location.origin
        );
      }

      if (window.google) {
        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInButton"),
          {
            theme: "outline",
            size: "large",
            text: "signin_with",
            shape: "pill",
            width: "100%",
          }
        );
      }
    };

    if (window.google) {
      initGoogleSignIn();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGoogleSignIn;
      document.body.appendChild(script);
    }

    return () => {};
  }, []);

  useEffect(() => {
    const authStatus = validateAuthToken();
    if (authStatus.valid) {
      navigate("/chat");
    }
  }, [navigate]);

  useEffect(() => {
    document.title = "Civilify | Sign In";
  }, []);

  const handleGoogleSignIn = (response) => {
    setIsLoading(true);
    try {
      // Clear any existing auth data to prevent conflicts
      clearAuthData();

      const { credential } = response;
      let payload;

      try {
        // Parse the JWT payload
        payload = JSON.parse(atob(credential.split(".")[1]));
        console.log("Google Sign-In payload:", payload);
      } catch (parseError) {
        console.error("Error parsing Google credential:", parseError);
        showErrorToast("Error processing Google sign-in data");
        setIsLoading(false);
        return;
      }

      // Create user data from Google payload
      const userToSave = {
        username: payload.name || "Google User",
        email: payload.email || "user@example.com",
        profile_picture_url:
          payload.picture || "https://randomuser.me/api/portraits/lego/1.jpg",
      };

      // Save to localStorage immediately to ensure data is available
      localStorage.setItem("user", JSON.stringify(userToSave));
      console.log("Saved Google user data to localStorage:", userToSave);

      // Send to your backend
      fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: credential }),
      })
        .then((response) => response.json())
        .then((data) => {
          // If backend provides additional user data, update localStorage
          if (data && data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
            console.log("Updated user data from backend:", data.user);
          } else if (data) {
            localStorage.setItem("user", JSON.stringify(data));
            console.log("Updated user data from backend:", data);
          }

          // Store the token and expiration data
          if (data && data.token) {
            localStorage.setItem("authToken", data.token);

            // Store token expiration information if available
            if (data.expiresAt) {
              localStorage.setItem(
                "tokenExpires",
                new Date(data.expiresAt).getTime().toString()
              );
              console.log(
                "Auth token stored with expiration:",
                new Date(data.expiresAt)
              );
            }
          }

          showSuccessToast("Successfully signed in with Google!");
          handleChatRedirect();
        })
        .catch((error) => {
          console.error("Google sign-in API error:", error);
          showErrorToast("Google sign-in failed");
        })
        .finally(() => setIsLoading(false));
    } catch (error) {
      console.error("Error processing Google sign-in:", error);
      showErrorToast("Error processing Google sign-in");
      setIsLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div style={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div style={styles.signinContainer}>
        <div style={styles.formContent}>
          <img
            src={logoIconOrange}
            alt="Civilify"
            style={styles.logo}
            className="logo"
          />

          <h2 style={styles.title} className="title">
            Welcome back
          </h2>
          <p style={styles.subtitle} className="subtitle">
            Sign in to continue
          </p>

          <form onSubmit={handleSubmit} style={styles.form} className="form">
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="your@email.com"
                required
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="********"
                  required
                />
                {formData.password && (
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
                          fill="#666"
                        />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"
                          fill="#666"
                        />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                style={{
                  ...styles.forgotPassword,
                  ...(forgotPasswordClicked && styles.forgotPasswordClicked),
                }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              style={styles.submitButton}
              disabled={isLoading}
            >
              Sign In
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <div
            id="googleSignInButton"
            style={styles.googleButtonContainer}
          ></div>

          <p style={styles.signupText}>
            Don't have an account?{" "}
            <Link to="/signup" style={styles.signupLink}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: "auto",
    width: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "0",
    margin: "0",
    overflow: "auto", // Changed from hidden to auto for better scrollability
    position: "relative", // Changed from fixed to relative
    minHeight: "100vh",
    minWidth: "100vw",
  },
  signinContainer: {
    width: "100%",
    maxWidth: "400px",
    padding: "32px 32px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.08)",
    margin: "40px auto",
  },
  logo: {
    width: "40px",
    height: "40px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "15px",
    color: "#666666",
    marginBottom: "28px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "16px",
    width: "100%",
    maxWidth: "320px",
    margin: "0 auto",
  },
  inputGroup: {
    width: "100%",
    textAlign: "left",
    position: "relative",
    marginBottom: "24px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a1a1a",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "15px",
    border: "1px solid rgba(0, 0, 0, 0.12)",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s ease",
    backgroundColor: "#ffffff",
    boxSizing: "border-box",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  eyeIcon: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    padding: "4px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButton: {
    width: "100%",
    maxWidth: "320px",
    padding: "12px",
    fontSize: "15px",
    fontWeight: "500",
    color: "#fff",
    backgroundColor: "#F34D01",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    margin: "0 auto",
    transition: "all 0.3s ease",
    position: "relative",
    overflow: "hidden",
    "&:hover": {
      background: "linear-gradient(90deg, #F34D01, #ff6b3d, #F34D01)",
      backgroundSize: "200% auto",
      animation: "buttonShine 1.5s linear infinite",
    },
  },
  divider: {
    position: "relative",
    textAlign: "center",
    margin: "16px 0",
    "&::before": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: 0,
      right: 0,
      height: "1px",
      backgroundColor: "rgba(0, 0, 0, 0.08)",
    },
  },
  dividerText: {
    position: "relative",
    backgroundColor: "#ffffff",
    padding: "0 16px",
    color: "#666666",
    fontSize: "14px",
  },
  googleButtonContainer: {
    display: "flex",
    justifyContent: "center",
    width: "100%",
    marginBottom: "24px",
    marginTop: "8px",
    minHeight: "48px",
  },
  signupText: {
    marginTop: "16px",
    fontSize: "14px",
    color: "#666666",
  },
  signupLink: {
    color: "#F34D01",
    textDecoration: "none",
    fontWeight: "500",
  },
  error: {
    backgroundColor: "#ffebee",
    color: "#d32f2f",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "14px",
    width: "100%",
    maxWidth: "320px",
    margin: "0 auto 16px",
  },
  formContent: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  forgotPassword: {
    background: "none",
    border: "none",
    color: "#F34D01",
    fontSize: "14px",
    padding: "0",
    cursor: "pointer",
    textAlign: "right",
    display: "block",
    marginLeft: "auto",
    marginTop: "8px",
    marginBottom: "16px",
    fontWeight: "500",
    textDecoration: "none",
    outline: "none", // Remove default outline
  },
  forgotPasswordClicked: {
    color: "#d43f01", // Darker orange for clicked state
    fontWeight: "600",
    textDecoration: "underline",
  },
};

// Add CSS for animations
const animationStyleSheet = document.createElement("style");
animationStyleSheet.textContent = `
  @keyframes buttonShine {
    0% {
      background-position: -100% center;
    }
    100% {
      background-position: 200% center;
    }
  }

  button[type="submit"]:hover {
    background: linear-gradient(90deg, #F34D01, #ff6b3d, #F34D01);
    background-size: 200% auto;
    animation: buttonShine 1.5s linear infinite;
  }

  @media (max-width: 375px){
    .form {
      gap: 1px !important;
    }
    .logo{
      margin-top: 50px;
      margin-bottom: 5px !important;
    }
    .title{
      margin-top: 0px !important;
      margin-bottom: 0px !important;
    }
    .subtitle{

    }

    .input {
      font-size: 14px;
    }

    .submitButton {
      font-size: 14px;
    }

    .dividerText {
      font-size: 12px;
    }

    .signupText {
      font-size: 12px;
    }

    .error {
      font-size: 12px;
    }

    .forgotPassword {
      font-size: 12px;
    }
  }
`;
document.head.appendChild(animationStyleSheet);

export default SignIn;
