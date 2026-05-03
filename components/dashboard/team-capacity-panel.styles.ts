import { createStyles } from "antd-style";

export const useStyles = createStyles(({ css }) => ({
  card: css`
    height: 100%;
    min-width: 0;
  `,
  table: css`
    max-width: 100%;
    min-width: 0;
  `,
}));
