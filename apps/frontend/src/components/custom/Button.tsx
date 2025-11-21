import { Button } from '@/components/ui/button.tsx'
import {
  type ComponentProps,
  type MouseEventHandler,
  useCallback,
  useState,
} from 'react'
import { Spinner } from '@/components/ui/spinner.tsx'

type CustomButtonProps = ComponentProps<typeof Button> & {
  onClick?: (event: MouseEvent) => void | Promise<void>
  loading?: boolean
}

function CustomButton(props: CustomButtonProps) {
  const { loading, children, onClick, ...rest } = props
  const [isLoading, setIsLoading] = useState(loading ?? false)
  console.log('rendering custom button', isLoading)
  const onClickHandler: MouseEventHandler<HTMLButtonElement> = useCallback(
    async (event) => {
      if (isLoading) return
      setIsLoading(true)
      if (onClick) await onClick(event)
      setIsLoading(false)
    },
    [onClick],
  )
  return (
    <Button {...rest} onClick={onClickHandler} disabled={isLoading}>
      {isLoading ? <Spinner /> : children}
    </Button>
  )
}

export { CustomButton }
