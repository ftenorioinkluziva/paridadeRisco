import * as React from "react";
import { SVGProps } from "react";
const BasketIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    {...props}
  >
    <path
      fill="currentColor"
      d="M5.5 21a.5.5 0 0 1-.5-.5V9h14v11.5a.5.5 0 0 1-.5.5h-13zM3 7l2.5-4h13L21 7H3zm5 4v7h2v-7H8zm4 0v7h2v-7h-2zm4 0v7h2v-7h-2z"
    />
  </svg>
);
export default BasketIcon;
