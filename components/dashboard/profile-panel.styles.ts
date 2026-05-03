import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
