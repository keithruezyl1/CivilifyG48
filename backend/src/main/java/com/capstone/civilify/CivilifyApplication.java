package com.capstone.civilify;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;



@SpringBootApplication
@EnableScheduling
public class CivilifyApplication {

	public static void main(String[] args) {
		SpringApplication.run(CivilifyApplication.class, args);
	}

}
