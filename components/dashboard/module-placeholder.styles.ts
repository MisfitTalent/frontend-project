import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  description: css`
    color: ${token.colorTextDescription} !important;
    margin: 0 !important;
    max-width: 48rem;
  `,
  header: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
    margin: 0 !important;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
