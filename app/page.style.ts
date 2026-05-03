import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  card: css`
    border: 0;
    box-shadow: ${token.boxShadowSecondary};
    height: 100%;
  `,
  container: css`
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: ${token.marginXL}px;
    justify-content: center;
    margin: 0 auto;
    max-width: 1120px;
    min-height: calc(100vh - 5rem);
    width: 100%;
  `,
  ctaGroup: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
  `,
  description: css`
    color: ${token.colorTextDescription} !important;
    font-size: ${token.fontSizeLG}px !important;
    margin-bottom: 0 !important;
    max-width: 720px;
  `,
  hero: css`
    background:
      radial-gradient(circle at top left, rgba(242, 140, 40, 0.16), transparent 24%),
      linear-gradient(160deg, #eef3f8, #f8fafc 45%, #eef3f8);
    min-height: 100vh;
    padding: ${token.paddingLG}px;
  `,
  intro: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
    max-width: 896px;
  `,
  title: css`
    font-size: clamp(2.8rem, 6vw, 4.5rem) !important;
    line-height: 1.1 !important;
    margin-bottom: 0 !important;
  `,
}));
