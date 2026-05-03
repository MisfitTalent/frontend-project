import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  benefits: css`
    display: grid;
    gap: ${token.marginSM}px;

    @media (min-width: 576px) {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  `,
  benefitCard: css`
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: ${token.borderRadiusLG}px;
    padding: ${token.paddingMD}px;
  `,
  content: css`
    display: grid;
    gap: ${token.marginXL}px;
    margin: 0 auto;
    max-width: 960px;
    min-height: calc(100vh - 5rem);

    @media (min-width: 992px) {
      align-items: center;
      grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    }
  `,
  footerText: css`
    color: ${token.colorTextDescription} !important;
    margin-bottom: 0 !important;
    text-align: center;
  `,
  hero: css`
    background:
      radial-gradient(circle at top left, rgba(242, 140, 40, 0.16), transparent 26%),
      linear-gradient(135deg, #eef3f8, #f8fafc 50%, #eef3f8);
    min-height: 100vh;
    padding: ${token.paddingLG}px;
  `,
  heroCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginLG}px;
  `,
  subtitle: css`
    color: ${token.colorTextDescription} !important;
    font-size: ${token.fontSizeLG}px !important;
    margin-bottom: 0 !important;
    max-width: 640px;
  `,
  title: css`
    font-size: clamp(2.8rem, 6vw, 4rem) !important;
    line-height: 1.1 !important;
    margin-bottom: 0 !important;
  `,
  formWrap: css`
    display: flex;
    justify-content: center;
  `,
  formInner: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
    max-width: 448px;
    width: 100%;
  `,
}));
