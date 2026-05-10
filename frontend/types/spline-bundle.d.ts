declare module "@splinetool/react-spline-bundle" {
  import type { ForwardRefExoticComponent, RefAttributes } from "react";
  import type { SplineProps } from "@splinetool/react-spline";

  const Spline: ForwardRefExoticComponent<SplineProps & RefAttributes<HTMLDivElement>>;

  export type { SplineProps };
  export default Spline;
}
