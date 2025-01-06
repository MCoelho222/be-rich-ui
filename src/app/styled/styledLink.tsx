import React from "react";
import Link from "next/link";
import styled from "styled-components";

interface StyledLinkProps {
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
  children: React.ReactNode;
}

const StyledLink = styled(React.forwardRef<HTMLAnchorElement, StyledLinkProps>(({ children, href, onClick }, ref) => (
  <Link href={href} passHref>
    <a ref={ref} onClick={onClick}>
      {children}
    </a>
  </Link>
)))`
  color: rgb(2 132 199);

  &:hover {
  color: color: rgb(7 89 133);
  text-decoration: underline;
  }
`

export default StyledLink;