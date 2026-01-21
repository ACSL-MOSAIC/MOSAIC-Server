import type { ButtonProps as ChakraButtonProps } from "@chakra-ui/react"
import {
  AbsoluteCenter,
  Box,
  Button as ChakraButton,
  Span,
} from "@chakra-ui/react"
import * as React from "react"

interface ButtonLoadingProps {
  loading?: boolean
  loadingText?: React.ReactNode
}

export interface ButtonProps extends ChakraButtonProps, ButtonLoadingProps {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(props, ref) {
    const { loading, disabled, loadingText, children, ...rest } = props
    return (
      <ChakraButton disabled={loading || disabled} ref={ref} {...rest}>
        {loading && !loadingText ? (
          <>
            <AbsoluteCenter display="inline-flex">
              <Box
                w="1em"
                h="1em"
                border="2px solid"
                borderColor="currentColor"
                borderTopColor="transparent"
                borderRadius="50%"
                style={{
                  animation: "spin 1s linear infinite",
                }}
              />
            </AbsoluteCenter>
            <Span opacity={0}>{children}</Span>
          </>
        ) : loading && loadingText ? (
          <>
            <Box
              w="1em"
              h="1em"
              border="2px solid"
              borderColor="currentColor"
              borderTopColor="transparent"
              borderRadius="50%"
              mr={2}
              style={{
                animation: "spin 1s linear infinite",
              }}
            />
            {loadingText}
          </>
        ) : (
          children
        )}
      </ChakraButton>
    )
  },
)
