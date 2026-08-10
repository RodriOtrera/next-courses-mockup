import "./styles.css";
const SuccessAnimation = () => {
  return (
    <div>
      <svg
        className="checkmark"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 52 52"
      >
        {" "}
        <circle
          className="checkmark__circle"
          cx="43"
          cy="43"
          r="86"
          fill="none"
        />{" "}
        <path
          className="checkmark__check"
          fill="none"
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
        />
      </svg>
    </div>
  );
};

export default SuccessAnimation;
