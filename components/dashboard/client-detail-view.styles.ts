import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  backLink: css`
    align-items: center;
    color: ${token.colorLink};
    display: inline-flex;
    gap: ${token.marginXS}px;
    font-weight: ${token.fontWeightStrong};
    transition: color ${token.motionDurationMid};

    &:hover {
      color: ${token.colorPrimaryHover};
    }
  `,
  card: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
  `,
  cardFullHeight: css`
    border-color: ${token.colorBorderSecondary};
    box-shadow: ${token.boxShadowTertiary};
    height: 100%;
  `,
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
  metricLabel: css`
    color: ${token.colorTextDescription} !important;
  `,
  metricTitle: css`
    margin: ${token.marginXS}px 0 ${token.marginXXS}px !important;
  `,
  skeletonButton: css`
    height: 1.5rem !important;
    width: 10rem !important;
  `,
  title: css`
    color: ${token.colorText} !important;
    margin: 0 !important;
  `,
}));
