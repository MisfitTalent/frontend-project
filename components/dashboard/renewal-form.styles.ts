import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  fullWidth: css`
    width: 100%;
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
}));
