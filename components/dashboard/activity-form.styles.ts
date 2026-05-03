import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
}));
