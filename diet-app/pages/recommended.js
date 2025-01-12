import { sessionOptions } from "@/lib/session";
import splitData from "@/lib/splitData";
import { Box, Button, Card, CardBody, CardFooter, Center, Flex, Heading, Image, Spinner, Stack, Tag, Text } from "@chakra-ui/react";
import { withIronSessionSsr } from "iron-session/next";
import Link from "next/link";
import { useRouter } from "next/router";
import querystring from 'querystring'
import { useEffect, useState } from "react";

export default function Recommended({user}) {
    const { query } = useRouter();
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [lastSelected, setLastSelected] = useState(0);

    useEffect(() => {
        const userPrefs = user.preferences || {};

        let paramStr = "" 
        if(userPrefs.excluded !== undefined && userPrefs.excluded.length !== 0) {
            paramStr += querystring.stringify({excluded: userPrefs.excluded})
        }
        if(userPrefs.health !== undefined && userPrefs.excluded.health !== 0) {
            paramStr = paramStr ? paramStr + "&": paramStr
            paramStr += querystring.stringify({health: userPrefs.health})
        }
        if(query) {
            paramStr = paramStr ? paramStr + "&": paramStr
            paramStr += querystring.stringify(query);
        }

        paramStr = paramStr ? "?" + paramStr : "?ingr=1%2B&random=true"
        fetch(`/api/recipes${paramStr}`)
        .then(raw => raw.json())
        .then(recipes => {
            console.log(recipes)
            setLoading(false);
            setRecipes(recipes);
        })
        .catch(err => setError(true));
    }, []);

    function viewRecipe(i) {
        return () => {
            setLastSelected(i + 1);
            fetch(`/api/user`, {
                method: "POST",
                body: JSON.stringify({
                    history: [...recipes.slice(lastSelected, i).map(x => {return {calories: x.calories, time: x.time, cuisine: x.cuisine, rating: 0}}), {calories: recipes[i].calories,  time: recipes[i].time, cuisine: recipes[i].cuisine, rating:1}]
                }),
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: "same-origin"
            });
            window.open(recipes[i].link);
        }
    }

    return loading ? <Center><Spinner></Spinner></Center> : 
    <Flex flexDir="row" flexWrap="nowrap" flex="none" w="100%" h="100vh" overflowX="auto" scrollSnapType="x mandatory" alignSelf="stretch">
    {
        recipes.map((recipe, i) => <Card key={i} w="100%" h="100%" flex="none" scrollSnapStop="always" scrollSnapAlign="center" overflowY="auto">
            <Image objectFit="cover" src={recipe.img}/>
            <CardBody>
                <Stack spacing={2}>
                    <Heading fontSize="xl">{recipe.name}</Heading>
                    <Box>
                        <Tag>
                        {recipe.cuisine}
                        </Tag>
                        
                    </Box>
                    <Box fontSize="sm">
                        <Text>⚡ {Math.round(recipe.calories)} Calories</Text>
                        <Text>🕛 {recipe.time}min</Text>
                        <Text></Text>
                    </Box>
                    <Text fontWeight="bold">Ingredients:</Text>
                    <ul style={{listStylePosition: "inside", padding: "4px 16px"}}>
                        {
                            recipe.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)
                        }
                    </ul>
                    {/*href={recipe.link} target="_blank"*/}
                    <Button onClick={viewRecipe(i)}>View Recipe</Button>
                </Stack>
            </CardBody>
        </Card>)
    }
    </Flex>
}

export const getServerSideProps = withIronSessionSsr(async function ({
    req,
    res,
  }) {
    const user = req.session.user;

    if (user === undefined) {
      console.log("not logged in")
      res.setHeader("location", "/");
      res.statusCode = 302;
      res.end();
      return {
        props: {
          user: { isLoggedIn: false}
        },
      };
    }
  
    return {
      props: { user: req.session.user },
    };
  },
  sessionOptions);