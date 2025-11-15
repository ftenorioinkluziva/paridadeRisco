import * as React from "react";
import { SVGProps } from "react";
const ChartIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M3 21h18v-2H3v2Zm0-4h18v-2H3v2Zm0-4h18v-2H3v2Zm0-4h18V7H3v2Zm0-6v2h18V3H3Z"
    />
    <path
      fill="currentColor"
      d="M7 19V9H5v10h2Zm4 0v-6H9v6h2Zm4 0V5h-2v14h2Zm4 0v-8h-2v8h2Z"
    />
  </svg>
);
export default ChartIcon;
