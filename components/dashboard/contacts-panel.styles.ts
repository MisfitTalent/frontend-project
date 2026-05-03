import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  header: css`
    align-items: center;
    display: flex;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
