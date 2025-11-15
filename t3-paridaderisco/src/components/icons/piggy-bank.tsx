import * as React from "react";
import { SVGProps } from "react";
const PiggyBankIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M16 6h1a1 1 0 0 1 1 1v2h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-2v2a1 1 0 0 1-1 1h-1v2h-2v-2H9v2H7v-2a4 4 0 0 1-4-4v-3a4 4 0 0 1 4-4h2V5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1zm-2 0V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1h4zm-1 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
    />
  </svg>
);
export default PiggyBankIcon;
