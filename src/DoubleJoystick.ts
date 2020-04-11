const doubleJoystickController: any = {
  name: "Double",
  component: "TouchableArea",
  props: { direction: "row" },
  children: [
    {
      component: "Area",
      props: null,
      children: [
        {
          component: "Joystick",
          props: {
            name: "One",
          },
          children: null,
        },
      ],
    },
    {
      component: "Area",
      props: null,
      children: [
        {
          component: "Joystick",
          props: {
            name: "Two",
          },
          children: null,
        },
      ],
    },
  ],
};

export default doubleJoystickController;
