package org.constructx.policyhub.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI policyHubOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Policy Hub API")
                        .description("REST API for the Policy Hub application")
                        .version("0.0.1-SNAPSHOT"));
    }
}
