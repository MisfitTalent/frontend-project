import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    height: 100%;
  `,
  extraText: css`
    color: ${token.colorTextDescription} !important;
    display: block;
    max-width: 100%;
  `,
}));
