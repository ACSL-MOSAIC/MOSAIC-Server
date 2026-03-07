import Logo from "/assets/images/mosaic.svg";
import { Container, Flex, Heading, Image, Input, Text } from "@chakra-ui/react";
import { Link as RouterLink, createFileRoute, redirect } from "@tanstack/react-router";
import { type SubmitHandler, useForm } from "react-hook-form";
import { FiLock, FiUser } from "react-icons/fi";

import type { AccountSignupDto } from "@/client/service/account.dto.ts";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { InputGroup } from "@/components/ui/input-group";
import { PasswordInput } from "@/components/ui/password-input";
import useAuth, { isLoggedIn } from "@/hooks/useAuth";
import { confirmPasswordRules, emailPattern, passwordRules } from "@/utils";

export const Route = createFileRoute("/signup")({
  component: SignUp,
  beforeLoad: async () => {
    if (isLoggedIn()) {
      throw redirect({
        to: "/",
      });
    }
  },
});

interface SignupForm extends AccountSignupDto {
  confirmPassword: string;
}

function SignUp() {
  const { signUpMutation } = useAuth();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      fullName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit: SubmitHandler<SignupForm> = (data) => {
    const { confirmPassword: _, ...signupData } = data;
    signUpMutation.mutate(signupData);
  };

  return (
    <>
      <Flex flexDir={{ base: "column", md: "row" }} justify="center" h="100vh">
        <Container
          as="form"
          onSubmit={handleSubmit(onSubmit)}
          h="100vh"
          maxW="sm"
          alignItems="stretch"
          justifyContent="center"
          gap={4}
          centerContent
        >
          <Image src={Logo} alt="FastAPI logo" height="auto" maxW="2xs" alignSelf="center" mb={2} />
          <Heading size="xl" textAlign="center" mb={6}>
            Sign Up
          </Heading>
          <Field invalid={!!errors.fullName} errorText={errors.fullName?.message}>
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="fullName"
                minLength={3}
                {...register("fullName", {
                  required: "Full Name is required",
                })}
                placeholder="Full Name"
                type="text"
              />
            </InputGroup>
          </Field>

          <Field invalid={!!errors.email} errorText={errors.email?.message}>
            <InputGroup w="100%" startElement={<FiUser />}>
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                placeholder="Email"
                type="email"
              />
            </InputGroup>
          </Field>
          <PasswordInput
            type="password"
            startElement={<FiLock />}
            {...register("password", passwordRules())}
            placeholder="Password"
            errors={errors}
          />
          <PasswordInput
            type="confirmPassword"
            startElement={<FiLock />}
            {...register("confirmPassword", confirmPasswordRules(getValues))}
            placeholder="Confirm Password"
            errors={errors}
          />
          <Button variant="solid" type="submit" loading={isSubmitting}>
            Sign Up
          </Button>
          <Text textAlign="center">
            Already have an account?{" "}
            <RouterLink to="/login" className="main-link">
              Log In
            </RouterLink>
          </Text>
        </Container>
      </Flex>
    </>
  );
}

export default SignUp;
