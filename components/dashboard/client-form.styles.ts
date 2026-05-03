import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  fieldGrid: css`
    display: grid;
    gap: ${token.marginLG}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  fullWidth: css`
    width: 100%;
  `,
  modalForm: css`
    padding-top: ${token.paddingMD}px;
  `,
  secondaryFieldGrid: css`
    display: grid;
    gap: ${token.marginLG}px;
    grid-template-columns: 1fr;
    margin-top: ${token.marginXS}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
}));
