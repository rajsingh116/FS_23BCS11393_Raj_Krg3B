// import { render, screen } from "@testing-library/react";
// import Tracker from "./Tracker";

// test("loads async data", async () => {
//   render(<Tracker />);

//   const text = await screen.findByText(/Eco data loaded/i, {}, { timeout: 3000 });

//   expect(text).toBeInTheDocument();
// });

import { render } from "@testing-library/react";
import Tracker from "./Tracker";

test("matches snapshot", () => {
  const { asFragment } = render(<Tracker />);
  expect(asFragment()).toMatchSnapshot();
});