
interface BackgroundProps {
  hideNotifications?: boolean,
  hasNavBar?:         boolean,
  lightStatusbar?:    boolean,

  paddStatusBar?:     boolean,
  fullScreen?:        boolean,
  hasTopBar?:         boolean,
  image?:             any,
  viewWrapper?:       boolean,
  testID?:            string,
  keyboardAvoid?:     boolean,
  style?:             any,
  children?:          any
}

interface AnimatedBackgroundProps extends BackgroundProps {
  duration?:          number,
}