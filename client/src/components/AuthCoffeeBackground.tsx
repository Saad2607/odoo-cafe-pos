import '../styles/auth-coffee-bg.css';

/** Static coffee background for login/signup */
export default function AuthCoffeeBackground() {
  return (
    <div className="auth-coffee-bg" aria-hidden="true">
      <div className="auth-coffee-image" />
      <div className="auth-coffee-vignette" />
    </div>
  );
}
