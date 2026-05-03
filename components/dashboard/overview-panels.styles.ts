import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  description: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
    max-width: 720px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  title: css`
    margin-bottom: 0 !important;
  `,
}));
