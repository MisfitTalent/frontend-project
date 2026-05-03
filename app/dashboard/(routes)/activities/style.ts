import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  section: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
}));
