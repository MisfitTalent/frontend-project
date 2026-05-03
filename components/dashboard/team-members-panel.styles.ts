import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  availabilityCell: css`
    min-width: 140px;
  `,
  card: css`
    border-color: ${token.colorBorderSecondary};
    height: 100%;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  memberCell: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  skillList: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginXS}px;
  `,
  tableCard: css`
    border-color: ${token.colorBorderSecondary};
  `,
}));
