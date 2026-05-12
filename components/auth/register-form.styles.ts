import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  alert: css`
    margin-bottom: ${token.marginLG}px;
  `,
  card: css`
    border: 0;
    box-shadow: ${token.boxShadowSecondary};
    max-width: 720px;
    width: 100%;
  `,
  fieldsGrid: css`
    display: grid;
    gap: ${token.marginLG}px;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  intro: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
    margin-bottom: ${token.marginXL}px;
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
  `,
  title: css`
    margin-bottom: 0 !important;
  `,
}));
