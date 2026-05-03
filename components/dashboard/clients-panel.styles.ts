import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  actionGroup: css`
    display: flex;
    gap: ${token.marginXS}px;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  header: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${token.marginSM}px;
    justify-content: space-between;
  `,
  headerCopy: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXXS}px;
  `,
  link: css`
    color: ${token.colorLink};
    font-weight: ${token.fontWeightStrong};
    transition: color ${token.motionDurationMid};

    &:hover {
      color: ${token.colorPrimaryHover};
    }
  `,
  mutedText: css`
    color: ${token.colorTextDescription} !important;
  `,
  title: css`
    margin: 0 !important;
  `,
}));
