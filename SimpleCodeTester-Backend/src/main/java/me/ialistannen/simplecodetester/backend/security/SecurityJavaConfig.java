package me.ialistannen.simplecodetester.backend.security;

import java.util.Collections;
import javax.servlet.http.HttpServletResponse;
import me.ialistannen.simplecodetester.backend.db.entities.User;
import me.ialistannen.simplecodetester.backend.db.repos.UserRepository;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.HmacKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@EnableWebSecurity
@Configuration
public class SecurityJavaConfig extends WebSecurityConfigurerAdapter {

  @Value("${jwt.secret.key}")
  private String jwtTokenSecret;

  @Bean
  public CommandLineRunner doStuff(UserRepository userRepository) {
    return args -> {
      try {
        userRepository.save(new User(
            "123",
            "John",
            new BCryptPasswordEncoder().encode("hey"),
            true,
            Collections.emptyList()
        ));
      } catch (Exception e) {
        e.printStackTrace();
      }
    };
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  JwtConsumer getJwtConsumer() {
    return new JwtConsumerBuilder()
        .setRequireExpirationTime()
        .setAllowedClockSkewInSeconds(60)
        .setMaxFutureValidityInMinutes(60)
        .setVerificationKey(new HmacKey(jwtTokenSecret.getBytes()))
        .build();
  }

  @Bean
  JwtGenerator getJwtGenerator() {
    return new JwtGenerator(new HmacKey(jwtTokenSecret.getBytes()));
  }

  @Override
  protected void configure(HttpSecurity http) throws Exception {
    http
        .csrf().disable()
        .exceptionHandling()
        .authenticationEntryPoint((request, response, authException) -> {
              System.out.println("NOO " + authException);
              response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
            }
        )
        .and()
        .addFilterBefore(
            new JwtFilter(getJwtConsumer()),
            UsernamePasswordAuthenticationFilter.class
        )
        // don't create session
        .sessionManagement().sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        .and()
        .authorizeRequests()
        .antMatchers("/login").permitAll()
        .anyRequest().authenticated();
  }
}