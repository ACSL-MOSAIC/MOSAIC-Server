package com.gistacsl.mosaic.account;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

import com.gistacsl.mosaic.account.dto.LoginDto;
import com.gistacsl.mosaic.account.dto.OrganizationLoginDto;
import com.gistacsl.mosaic.account.dto.SignupDto;
import com.gistacsl.mosaic.common.GResponse;
import com.gistacsl.mosaic.common.dto.MessageDto;
import com.gistacsl.mosaic.security.authentication.UserAuth;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/account")
@RequiredArgsConstructor
public class AccountController {
  private final AccountService accountService;

  @PostMapping(value = "/login/access-token")
  public Mono<GResponse<LoginDto.Res>> login(@RequestBody LoginDto.Req req) {
    return accountService.login(req).map(GResponse::toGResponse);
  }

  @PostMapping(value = "/login/organization/access-token")
  public Mono<GResponse<OrganizationLoginDto.Res>> loginWithOrganization(
      @RequestBody OrganizationLoginDto.Req req) {
    return accountService.loginWithOrganization(req).map(GResponse::toGResponse);
  }

  @PostMapping("/disconnect")
  public Mono<GResponse<MessageDto>> disconnect() {
    return UserAuth.getUserAuthFromSecurityContextHolder()
        .flatMap(accountService::disconnect)
        .map(GResponse::toGResponse);
  }

  @PostMapping("/signup")
  public Mono<GResponse<MessageDto>> signup(@RequestBody SignupDto.Req req) {
    return accountService.signup(req).map(GResponse::toGResponse);
  }
}
