import { createStyles } from "antd-style";

export const useStyles = createStyles(({ token, css }) => ({
  chartShell: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  chartText: css`
    font-size: ${token.fontSizeHeading4}px;
    font-weight: ${token.fontWeightStrong};
  `,
  chartWrap: css`
    margin-inline: auto;
  `,
  container: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginMD}px;
  `,
  countText: css`
    font-size: ${token.fontSizeSM}px;
    font-weight: ${token.fontWeightStrong};
  `,
  divider: css`
    border-top: 1px solid ${token.colorBorderSecondary};
    margin-top: ${token.marginSM}px;
    padding-top: ${token.paddingSM}px;
  `,
  legendColumn: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginSM}px;
  `,
  legendList: css`
    display: flex;
    flex-direction: column;
    gap: ${token.marginXS}px;
  `,
  legendMeta: css`
    align-items: center;
    display: flex;
    gap: ${token.marginMD}px;
  `,
  legendRow: css`
    align-items: center;
    border-radius: ${token.borderRadius}px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    padding: ${token.paddingXS}px ${token.paddingSM}px;
    transition: background-color ${token.motionDurationMid}, opacity ${token.motionDurationMid};
  `,
  legendRowDimmed: css`
    background: ${token.colorFillAlter};
    opacity: 0.4;
  `,
  legendRowName: css`
    font-weight: ${token.fontWeightStrong};
    transition: color ${token.motionDurationMid}, font-weight ${token.motionDurationMid};
  `,
  legendRowNameMuted: css`
    color: ${token.colorTextDescription};
    font-weight: ${token.fontWeightStrong};
  `,
  legendRowStart: css`
    align-items: center;
    display: flex;
    gap: ${token.marginXS}px;
  `,
  legendValue: css`
    color: ${token.colorTextDescription};
    font-size: ${token.fontSizeSM}px;
  `,
  layout: css`
    display: grid;
    gap: ${token.marginLG}px;
    grid-template-columns: 1fr;

    @media (min-width: 768px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
  swatch: css`
    align-items: center;
    border-radius: 9999px;
    display: inline-flex;
    height: 0.75rem;
    justify-content: center;
    width: 0.75rem;
  `,
  swatchSvg: css`
    display: block;
    height: 0.75rem;
    width: 0.75rem;
  `,
  slice: css`
    cursor: pointer;
    transition: opacity 200ms ease;
  `,
  totalRow: css`
    display: flex;
    justify-content: space-between;
  `,
  totalValue: css`
    font-weight: ${token.fontWeightStrong};
  `,
}));
