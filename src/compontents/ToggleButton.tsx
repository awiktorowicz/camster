interface Props {
  name: string;
  state: boolean;
  onButtonClick: (state: boolean) => void;
}

const ToggleButton = ({ name, state, onButtonClick }: Props) => {
  return (
    <button
      onClick={() => {
        onButtonClick(state);
      }}
      className={`toggle-button-${state ? 'on' : 'off'}`}
    >
      {name} {state ? 'ON' : 'OFF'}
    </button>
  );
};

export default ToggleButton;
